import graphene
import graphene_django

from graphene import relay
from django.contrib.auth.backends import UserModel
from django.db.models import Avg

from .models import Book, HasRead, rate_book, delete_rating


class UserType(graphene_django.DjangoObjectType):
    is_admin = graphene.Boolean()
    average_rating = graphene.Float()

    def resolve_is_admin(self, info):
        return self.is_staff

    def resolve_average_rating(self, info):
        query = self.books_read.all().aggregate(Avg('rating'))
        return query['rating__avg']

    class Meta(object):
        model = UserModel
        only_fields = ('id', 'username', 'books_read')
        interfaces = (relay.Node,)


class BookType(graphene_django.DjangoObjectType):
    class Meta(object):
        model = Book
        interfaces = (relay.Node,)


class HasReadType(graphene_django.DjangoObjectType):
    class Meta(object):
        model = HasRead
        interfaces = (relay.Node,)


class Query(graphene.ObjectType):
    users = graphene_django.DjangoConnectionField(UserType)
    user = relay.Node.Field(UserType, id=graphene.ID(required=True))
    books = graphene_django.DjangoConnectionField(BookType, fiction=graphene.Boolean())

    def resolve_users(self, info):
        return UserModel.objects.all()

    def resolve_user(self, info, **kwargs):
        user_id =kwargs['id']
        return UserModel.objects.get(id=user_id)

    def resolve_books(self, info, **kwargs):
        fiction = kwargs.get('fiction')
        q = Book.objects.all()

        if fiction is not None:
            q = q.filter(fiction=fiction)

        return q


class RateBook(graphene.Mutation):
    class Arguments(object):
        book = graphene.Int(required=True)
        user = graphene.Int(required=True)
        rating = graphene.Int(required=True)

    has_read = graphene.Field(HasReadType)

    def mutate(self, info, **kwargs):
        book_id = kwargs['book']
        user_id = kwargs['user']
        rating = kwargs['rating']

        has_read = rate_book(book_id, user_id, rating)
        return RateBook(has_read=has_read)


class DeleteRating(graphene.Mutation):
    class Arguments(object):
        book = graphene.Int(required=True)
        user = graphene.Int(required=True)

    query = graphene.Field(Query)

    def mutate(self, info, **kwargs):
        book_id = kwargs['book']
        user_id = kwargs['user']

        delete_rating(book_id, user_id)
        return DeleteRating(query=Query)


class Mutation(graphene.ObjectType):
    rate_book = RateBook.Field()
    delete_rating = DeleteRating.Field()


schema = graphene.Schema(query=Query, mutation=Mutation)